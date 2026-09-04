/* eslint-disable react-hooks/exhaustive-deps */
/* eslint-disable react-hooks/immutability */
"use client";

import { Crown, Medal, Award } from "lucide-react";
import { useEffect, useState } from "react";

const ModeratorPerformanceCard = () => {
  const baseUrl = process.env.NEXT_PUBLIC_API_URL;

  const [loading, setLoading] = useState(true);
  const [performance, setPerformance] = useState([]);

  useEffect(() => {
    fetchPerformance();
  }, []);

  const fetchPerformance = async () => {
    try {
      setLoading(true);

      const res = await fetch(`${baseUrl}/api/orders/moderator-performance`, {
        cache: "no-store",
      });

      const data = await res.json();

      if (data.success) {
        setPerformance(data.data);
      }
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white rounded-2xl border border-stone-200 p-6 h-full">
      <div className="mb-6">
        <h2 className="text-2xl font-semibold text-stone-800">
          Moderator Performance
        </h2>

        <p className="text-sm text-stone-500">Last 30 Days Activity</p>
      </div>

      {loading ? (
        <p className="text-stone-500">Loading...</p>
      ) : performance.length === 0 ? (
        <p className="text-stone-500">No activity found.</p>
      ) : (
        <div className="space-y-5">
          {performance.map((item, index) => (
            <div
              key={item.moderator}
              className=" pb-2"
            >
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-3">
                  {index === 0 && (
                    <div className="w-10 h-10 rounded-full bg-yellow-100 flex items-center justify-center">
                      <Crown className="w-5 h-5 text-yellow-600" />
                    </div>
                  )}

                  {index === 1 && (
                    <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center">
                      <Medal className="w-5 h-5 text-gray-600" />
                    </div>
                  )}

                  {index === 2 && (
                    <div className="w-10 h-10 rounded-full bg-orange-100 flex items-center justify-center">
                      <Award className="w-5 h-5 text-orange-600" />
                    </div>
                  )}

                  {index > 2 && (
                    <div className="w-10 h-10 rounded-full bg-stone-100 flex items-center justify-center font-semibold text-stone-600">
                      #{index + 1}
                    </div>
                  )}

                  <div>
                    <p className="font-semibold text-lg capitalize">
                      {item.moderator}
                    </p>

                    <p className="text-xs text-stone-500">Rank #{index + 1}</p>
                  </div>
                </div>

                <span className="font-bold text-[#d4af37]">
                  {item.totalActions} Actions
                </span>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-3 items-start gap-y-2 text-sm">
                <p>
                  <span className="font-medium">Verified:</span> {item.verified}
                </p>

                <p>
                  <span className="font-medium">Delivered:</span>{" "}
                  {item.delivered}
                </p>

                <p>
                  <span className="font-medium">Cancelled:</span>{" "}
                  {item.cancelled}
                </p>

                <p>
                  <span className="font-medium">Calls:</span> {item.calls}
                </p>

                <p>
                  <span className="font-medium">WhatsApp:</span> {item.whatsapp}
                </p>

                <p>
                  <span className="font-medium">Total:</span>{" "}
                  {item.totalActions}
                </p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default ModeratorPerformanceCard;
